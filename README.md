# Unified Database Template


## Installation

---

### Development 
1) Get started with the template by clicking `Use this template` button on the top of the page.
2) Once you have it on your computer start by running the npm install command. `npm i`
3) Then Copy the example.env file and update it with the appropriate values. 
4) Once you have obtained all the needed env variables. Please run the setup script found in the scripts directory 
   1) `sh /scripts/setup.sh`
5) You are now ready for development! run `npm run dev` to get started!

## What is included

* 3rd Party Software
  * [Next.js](https://nextjs.org/docs/getting-started)
  * [AG Grid](https://www.ag-grid.com/react-data-grid/getting-started/)
    * For Building Tables. 
  * [Mantine Components](https://mantine.dev/getting-started/)
    * For Rapid Development. The have basically a component for anything you could ever want to build
  * [NextAuth](https://next-auth.js.org/getting-started/example)
    * For Google Log in
  * [Tan Stack Query](https://tanstack.com/query/latest/docs/framework/react/quick-start)
    * The best solution for asynchronous application state.
  * [Winston](https://github.com/winstonjs/winston?tab=readme-ov-file) 
    * For Logging
  * [PG](https://node-postgres.com/) 
    * For Postgres Database Connection
  
* Misc Modules
  * Another-Random-Package
    * A module that generates random strings, numbers and sequences.
  * clsx
    * A module for conditionally joining class names
  * date-fns
    * A module for manipulating dates
  * js-convert-case
    * A module for converting strings to different cases
  * 
* Internal Software
  * Unified DB Usage tracking
    * Anytime a page is visited it is logged to the database
  * Unified DB Role Based Access Control System
    * Users can be assigned Roles and Permissions to access data and resources. 

