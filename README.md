# mySewingOrganiser


### Prerequisites

- [Go](https://go.dev/dl/)
- [Node.js](https://nodejs.org/)
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- On macOS: Xcode command line tools (`xcode-select --install`)

Make sure `$(go env GOPATH)/bin` is on your `PATH`, then check your setup with:

```bash
wails doctor
```

### Run in development

From the project root (the folder containing `wails.json`):

```bash
wails dev
```

This starts the app with hot reload for the front end. Go changes rebuild automatically.

### Build

```bash
wails build
```
