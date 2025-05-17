#!/usr/bin/env python3
"""
Custom HTTP server that sets the correct MIME types for JavaScript modules.
"""

import http.server
import socketserver
import os
import sys

PORT = 3000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler that sets the correct MIME types for JavaScript modules."""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def guess_type(self, path):
        """
        Override the MIME type for JavaScript and TypeScript files.
        """
        base, ext = os.path.splitext(path)
        
        if ext == '.js' or ext == '.mjs':
            return 'application/javascript'
        elif ext == '.ts' or ext == '.tsx':
            return 'application/typescript'
        elif ext == '.jsx':
            return 'application/javascript'
        elif ext == '.json':
            return 'application/json'
        elif ext == '.html':
            return 'text/html'
        elif ext == '.css':
            return 'text/css'
        
        return super().guess_type(path)

def run_server():
    """Run the HTTP server."""
    handler = CustomHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.server_close()

if __name__ == "__main__":
    # Change to the directory containing the script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_server()
