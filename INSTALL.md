Steps to steup this app

1. Install wasp
check the wasp documentation and install it

1.1  cd app
cp .env.server.example .env.server

2. wasp db start
start the postgres database

3. wasp db migrate-dev
migrate the database

4. wasp start
start the app