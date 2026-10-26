EDUPATH WEB FRONTEND SOURCE REPLACEMENT

This archive contains the active React source tree under src/. It intentionally excludes the duplicate nested src/src tree and does not contain package.json, package-lock.json, node_modules/, or .env.local.

Back up your project first. Extract this ZIP into:
C:\xampp\htdocs\G5_Edupath\frontend
Allow overwriting files under src/. Keep package.json, node_modules/, and your environment configuration.

After extraction, run in PowerShell:
  cd C:\xampp\htdocs\G5_Edupath\frontend
  npm install
  npm run build

If your dependencies are already installed and package.json has not changed, npm install may be unnecessary; npm run build is the main verification step.

The entrance exam admin page includes score/status/remarks editing and an official release control. The applicant results card only displays scores/remarks after the API provides an official results_released_at timestamp. Confirmation dialogs and modals use centered fixed overlays through the shared ModalPortal component.

For phone Chrome testing on the same Wi-Fi, run Laravel with --host=0.0.0.0 and Vite with --host 0.0.0.0, then open http://YOUR_PC_WIFI_IPV4:5173 on the phone. Ensure VITE_API_BASE_URL points to http://YOUR_PC_WIFI_IPV4:8000/api if you use an environment override, and allow the development servers through Windows Firewall on Private networks.
