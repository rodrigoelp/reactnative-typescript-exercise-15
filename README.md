# How to preserve data in a database

The objective behind this exercise is to investigate what's required to save/recover data from a repository or database. For this, let's imagine we have an online catalog of books (ebooks) and we want to present it on screen; functionaly, the complication can be achieved by just downloading the file and present it to the user but, it would be better to keep a copy of that information (assuming the data does not change constantly) to save data transfer, as well as the waiting time whilst the application is downloading the catalog.

This enable us to do:

- A restructure of the data making it friendlier to our development approach.
- Use it as a cache for our products.
- Reduce data transfer, saving resources (to the user and our data centre).
- Make the application more responsive as we can operate locally instead of waiting for the data to become available.

## The original intent

As stated above, the idea is to create an application with a local data store (without making it the application store like what we did with the redux persist exercise) and the options are multiple: CouchDB (more on this below), PoachDB, SQLite, plain old file.

We are not going to look into plain old file, as that is already provided by the `asyncStorage`

### CouchDB

Given [CouchDB](http://couchdb.apache.org/) is quite a populate database nowadays (several reasons I am not going to get into), I decided to take a deeper look into it. Now... there is a little problem. CouchDB is meant to be your `application server` and as far I could read online, the main service has to be hosted to query its `http/json` interface.

That is not going to play well with the intent we had above doesn't it?

This does not rule out CouchDB entirely, it just means it won't live in the mobile app but can provide the backend to our application.

### PouchDB

[PouchDB](https://pouchdb.com/) provides the local storage and keep it offline in case the CouchDB server is not accessible. It provides the nice abstraction to save your object such as:

```javascript
import PouchDB from "pouchdb";

const db = new PouchDB("dbName");

db.get("identifier").then(doc => {
    // Do something with the doc
});
```

Now, different implementation I have seen online rely on sqlite to preserve its information. So, let's take a look at the sqlite implementation first and pouchdb will be pushed as exercise 16.

### SQLite

[SQLite](https://www.sqlite.org/) is a smaller version of any SQL engine out there with the exception that is not architected in a client-server model. It embeds as part of the end result program, excellent as an offline storage.

This means we will need some sort of adapter to communicate with the sql storage, for this I used `react-native-sqlite-storage` which wraps the plugin and exposes it to the application such as:

```javascript
import sqlite from "react-native-sqlite-storage";

let db;

sqlite.openDatabase("dbname", "version", "alias", size)
        .then(x => db = x)
        .then(_ =>db.executeSql("Select * From Employees"))
        .then(result =>{
            // assuming an object like { name: string; position: string } per row.
            for (let i = 0; i < result.rows.length; i++){
                let data = result.rows.item(i);
                console.log('Name: ' + row.name + " Position: " + row.position);
            }
        });
```

Given different implementations of PouchDB and/or other document based databases seem to rely on sqlite, I decided to dedicate this first iteration of the exercise to understand sqlite.