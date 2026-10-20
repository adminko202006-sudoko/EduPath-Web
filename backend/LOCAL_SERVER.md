# Run EduPath for a physical phone

Start MySQL in XAMPP, then run this from the backend directory:

```powershell
.\start-lan.bat
```

The launcher runs `php artisan serve --host=0.0.0.0 --port=8000` from this backend directory. Keep the terminal running; Ctrl+C stops the server. Stop an existing port-8000 server before launching another one.

In the mobile application's Server Configuration, enter:

```text
http://<computer-wifi-ip>:8000/api
```

Use the computer's current Wi-Fi IPv4 address, shown by `ipconfig`. Both devices must be able to reach each other. Then select **Test Connection & Save**.

Plain `php artisan serve` defaults to `127.0.0.1`. That works on the computer but cannot accept connections addressed to its Wi-Fi IP. `0.0.0.0` is a server listening setting; do not enter it as the phone's Server URL.

For an Android emulator, use `http://10.0.2.2:8000/api`. On a physical phone, `localhost` and `127.0.0.1` refer to the phone itself.

To diagnose connectivity, open `http://<computer-wifi-ip>:8000/api/programs` in the phone's browser. An EduPath JSON response confirms that the server is reachable. If it still times out, check whether the Wi-Fi IP changed, whether both devices are on a network that permits communication, and whether the server port is blocked. Do not disable the firewall or bypass the app's connection test to hide the problem.

This is a local development launcher. Production deployments use a configured HTTPS web server.
