#!/usr/bin/env python3

import json
import os
import signal
import socket
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


BIND_HOST = "0.0.0.0"
DISPLAY_HOST = "127.0.0.1"
PORT = 4173
SERVER_PATH = Path(__file__).resolve()
RUNTIME_PATH = SERVER_PATH.parent / ".server"
PID_PATH = RUNTIME_PATH / "server.pid"
LOG_PATH = RUNTIME_PATH / "server.log"
STOP_TIMEOUT = 5.0
PROGRESS_PATH = SERVER_PATH.parent / "saves" / "progress.json"
API_PATH = "/api/progress"
# Sound and language stay per device, so only progress keys are kept on the server.
SYNCED_KEYS = (
    "livingWordsProgressV2",
    "islandDiscoveryV2",
    "forestLightProgressV1",
    "roboStoriesProgressV1",
    "roboStoriesSurveyV1",
    "gardenQuestBestScoresV3",
    "gardenQuestUnlockedV1",
    "secretRuleLabCompletedV1",
    "blockTownWorldsV1",
    "blockTownBlocksV1",
)

# ThreadingHTTPServer answers every request in its own thread.
progress_lock = threading.Lock()


def read_progress():
    # Only a missing file counts as empty: a broken one must fail the request instead of being
    # overwritten by the next save.
    try:
        return json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}


def write_progress(progress):
    """Replace the file in one step, so a crash never leaves half of it. Callers hold the lock."""
    PROGRESS_PATH.parent.mkdir(exist_ok=True)
    temporary_path = PROGRESS_PATH.with_suffix(".tmp")
    with temporary_path.open("w", encoding="utf-8") as temporary_file:
        temporary_file.write(json.dumps(progress, ensure_ascii=False, indent=2))
        temporary_file.flush()
        os.fsync(temporary_file.fileno())
    os.replace(temporary_path, PROGRESS_PATH)


class NoCacheRequestHandler(SimpleHTTPRequestHandler):
    """Without this the browser keeps old game files after an update."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        if self.path != API_PATH:
            super().do_GET()
            return

        with progress_lock:
            saved = read_progress()
        # The pages learn the allowlist from "keys". "progress" holds only the keys in the file, with
        # null for a reset, so a lost file is told apart from a reset.
        progress = {key: saved[key] for key in SYNCED_KEYS if key in saved}
        body = json.dumps({"keys": SYNCED_KEYS, "progress": progress}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self):
        key = self.progress_key()
        if not key:
            return

        value = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode("utf-8")
        with progress_lock:
            progress = read_progress()
            progress[key] = value
            write_progress(progress)
        self.send_response(204)
        self.end_headers()

    def do_DELETE(self):
        key = self.progress_key()
        if not key:
            return

        with progress_lock:
            progress = read_progress()
            # A null marks the reset, so other browsers remove their copies instead of pushing them.
            progress[key] = None
            write_progress(progress)
        self.send_response(204)
        self.end_headers()

    def progress_key(self):
        """Return the synced key named by the path, or answer 404 and return None."""
        prefix = API_PATH + "/"
        key = self.path[len(prefix):] if self.path.startswith(prefix) else None
        if key not in SYNCED_KEYS:
            self.send_error(404)
            return None
        return key


def lan_host():
    """The name other computers on the home network reach this one by."""
    name = socket.gethostname()
    return name if "." in name else f"{name}.local"


def urls():
    return f"http://{DISPLAY_HOST}:{PORT}/ and http://{lan_host()}:{PORT}/"


def serve():
    os.chdir(SERVER_PATH.parent)
    server = ThreadingHTTPServer((BIND_HOST, PORT), NoCacheRequestHandler)
    print(f"Serving games at {urls()}", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def running_pid():
    """Return the pid of the background server, or None when it is not running."""
    try:
        pid = int(PID_PATH.read_text().strip())
    except (OSError, ValueError):
        return None

    try:
        os.kill(pid, 0)
    except OSError:
        PID_PATH.unlink(missing_ok=True)
        return None

    return pid


def start_command():
    pid = running_pid()
    if pid:
        print(f"Already running with pid {pid} at {urls()}")
        return

    RUNTIME_PATH.mkdir(exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as log:
        process = subprocess.Popen(
            [sys.executable, str(SERVER_PATH)],
            cwd=SERVER_PATH.parent,
            stdout=log,
            stderr=log,
            start_new_session=True,
        )

    # A busy port kills the child right away, so give it a moment before reporting success.
    time.sleep(0.5)
    if process.poll() is not None:
        print(f"Could not start the server, see {LOG_PATH.relative_to(SERVER_PATH.parent)}", file=sys.stderr)
        sys.exit(1)

    PID_PATH.write_text(f"{process.pid}\n")
    print(f"Started with pid {process.pid} at {urls()}")


def stop_command():
    pid = running_pid()
    if not pid:
        print("Not running")
        return

    os.kill(pid, signal.SIGTERM)
    deadline = time.monotonic() + STOP_TIMEOUT
    while time.monotonic() < deadline:
        time.sleep(0.1)
        try:
            os.kill(pid, 0)
        except OSError:
            break
    else:
        print(f"The server with pid {pid} did not stop", file=sys.stderr)
        sys.exit(1)

    PID_PATH.unlink(missing_ok=True)
    print(f"Stopped the server with pid {pid}")


def restart_command():
    stop_command()
    start_command()


def status_command():
    pid = running_pid()
    if pid:
        print(f"Running with pid {pid} at {urls()}")
    else:
        print("Not running")


COMMANDS = {
    "start": start_command,
    "stop": stop_command,
    "restart": restart_command,
    "status": status_command,
}


def main():
    arguments = sys.argv[1:]
    if not arguments:
        serve()
        return

    if len(arguments) > 1 or arguments[0] not in COMMANDS:
        print(f"Usage: {SERVER_PATH.name} [{' | '.join(COMMANDS)}]", file=sys.stderr)
        sys.exit(2)

    COMMANDS[arguments[0]]()


if __name__ == "__main__":
    main()
