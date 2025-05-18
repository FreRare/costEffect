# CostEffect

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.3.

## Run the app with node server
To start the application run the command:
```bash
ng build
npm run server
```
For database connection please run:
```bash
touch .env
cat DB_CONN_URL="your url here" > .env
```

## Development server

To start a local development server, run:
```bash
ng serve
```
This only launches the angular server, we still need to run the node server, so also run
```bash
npm run server
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.
Or if you run the NODE server http://localhost:3000 is better, if you have built the angular project first
## Building
If the node server is desired please run this command before starting the server
To build the project run:
```bash
ng build
```
This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.
