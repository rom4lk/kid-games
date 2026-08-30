#!/usr/bin/env python3

import json
import os
import secrets
import signal
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


BIND_HOST = "0.0.0.0"
DISPLAY_HOST = "127.0.0.1"
PORT = 4173
SERVER_ID = secrets.token_hex(8)
SERVER_PATH = Path(__file__).resolve()
PID_PATH = SERVER_PATH.parent / ".server.pid"
LOG_PATH = SERVER_PATH.parent / "server.log"
STOP_TIMEOUT = 5.0


class GameRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__health":
            self.send_json({"serverId": SERVER_ID})
            return

        super().do_GET()

    def do_POST(self):
        if self.path != "/__restart":
            self.send_error(404)
            return

        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host"):
            self.send_error(403)
            return

        self.send_json({"serverId": SERVER_ID, "status": "restarting"})
        threading.Thread(target=restart_server, daemon=True).start()

    def send_json(self, value):
        body = json.dumps(value).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()


def restart_server():
    time.sleep(0.2)
    os.execv(sys.executable, [sys.executable, str(SERVER_PATH)])


def serve():
    os.chdir(SERVER_PATH.parent)
    server = ThreadingHTTPServer((BIND_HOST, PORT), GameRequestHandler)
    print(f"Serving games at http://{DISPLAY_HOST}:{PORT}/", flush=True)

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
        print(f"Already running with pid {pid} at http://{DISPLAY_HOST}:{PORT}/")
        return

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
        print(f"Could not start the server, see {LOG_PATH.name}", file=sys.stderr)
        sys.exit(1)

    PID_PATH.write_text(f"{process.pid}\n")
    print(f"Started with pid {process.pid} at http://{DISPLAY_HOST}:{PORT}/")


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
        print(f"Running with pid {pid} at http://{DISPLAY_HOST}:{PORT}/")
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
