# simple-node-server
A simple app server and load balancing proxy server created in Node JS


Setup: API routes go in /routes/ and pages ho in /pages/ See the relevant defaults.js for how this works.

To add a server to the load balancer, create a file ../conf/allowed_servers.json and add the generated keys to it in the format SERVER_ID:KEY
