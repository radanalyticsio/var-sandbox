# var-sandbox

Value at Risk sandbox scaffolding application

This project is a mixed-mode Python Flask and React application. As such it
is slightly complicated to assemble and run. If you wish to simply try out
the application follow the easy instructions, alternatively for development
work please see the advanced instructions.

## Easy install

The easiest way to use this image is to create a container from the
Dockerfile and use that to access the application. This can be done most
simply with the following:

```
$ docker build -t var-sandbox .
... <build output> ...
$ docker run --rm -it -p 8080:8080 var-sandbox
```

Once running, access `http://127.0.0.1:8080/` with your browser.

## Advanced install

There are 2 main steps to running this project: compile the React components,
and run the Flask application.

To help automate these processes we recommend using a Python virtual
environment to setup the Flask requirements, and use the
[Yarn](https://yarnpkg.com) project to install and compile the React
components.

**Install the Python requirements**

```
$ pip install -r requirements.txt
```

**Install and build the React components**

```
$ yarn install
$ yarn run build
```

**Run the application with Yarn**

```
$ yarn run start
```

As before, visit `http://127.0.0.1:8080/` with your browser.
