import * as React from "react";
import { AppRegistry, View, Text, Platform, StyleSheet, FlatList } from 'react-native';
import * as sqlite from "react-native-sqlite-storage";
import { Database, OpenParams, Result, ErrorCode } from "react-native-sqlite-storage";
import { Book, BookAttributes, BookSummary } from "./models";

sqlite.DEBUG(true);
sqlite.enablePromise(true);

let dbInstance: Database;
const baseUrl = "https://raw.githubusercontent.com/rodrigoelp/reactnative-typescript-exercise-15/master/onlineCatalog/";

interface AppState {
    books: BookSummary[]
}

class App extends React.Component<{}, AppState> {
    constructor(props: any) {
        super(props);

        this.state = { books: [] };
    }

    componentDidMount() {
        this.initDbConnection()
            .then(this.createDatabase)
            .then(this.checkIfBooksHaveBeenDownloaded)
            .then(this.downloadContentIfRequired)
            .then(this.displayContents)
            .catch(e => {
                const code = e.code as number;
                console.log(`App needs to display an error message here. Received an reason (${code}) and message: ${e.message}`);
            });
    }

    componentWillUnmount() {
        if (dbInstance) {
            dbInstance.close();
        }
    }

    public render() {
        return (
            <View style={{ flex: 1, backgroundColor: "#eeeeff" }}>
                <FlatList
                    data={this.state.books}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={({ item }) => this.renderBook(item)}
                />
            </View>
        );
    }

    renderBook = (book: BookSummary) => {
        return (
            <View style={{ flex: 1 }}>
                <Text>{book.name}</Text>
            </View>
        );
    }

    initDbConnection = () => {
        const params: OpenParams = {
            name: "ebooks.db",
            createFromLocation: "~/db/ebooks.db",
            location: "Library"
        };
        return sqlite.openDatabase(params)
            .then(db => {
                dbInstance = db;
                return db;
            });
    };

    createDatabase = (db: Database) => {
        console.log("Creating the data structures to store the data.");
        const script = "create table if not exists Ebooks (" +
            "book_id integer primary key not null," +
            "name varchar(140) not null," +
            "author varchar(140)," +
            "rating integer," +
            "tags varchar(140)," +
            "bannerUrl varchar(256)," +
            "thumbnailUrl varchar(256)" +
            ") ";
        return db.executeSql("drop table if exists Ebooks")
            .then(_ => db.executeSql(script))
            .then(_ => db);
    }

    checkIfBooksHaveBeenDownloaded = (db: Database) => {
        return db.executeSql("select count(*) from Ebooks")
            .then(r => {
                console.log("");
                return { database: db, isPopulated: false };
            });
    }

    downloadContentIfRequired = (result: { database: Database, isPopulated: boolean }) => {
        if (!result.isPopulated) {
            return fetch(`${baseUrl}index.json`)
                .then(r => r.json())
                .then(r => this.persistData(r, result.database));
        }
        return Promise.resolve(new Array<any>());
    };

    persistData = (data: Book[], db: Database) => {
        return db.transaction(
            tx => {
                const insertions = data.forEach(
                    (book, index) => {
                        const banner = `${baseUrl}${book.attributes.images_banner}`;
                        const thumb = `${baseUrl}${book.attributes.images_thumbnail}`;
                        const values = `${index}, "${book.name}", "${book.attributes.overview_author}", ${book.rate}, "${book.tags}", "${banner}", "${thumb}"`;
                        const insert = `insert into Ebooks(book_id, name, author, rating, tags, bannerUrl, thumbnailUrl) values (${values})`;

                        tx.executeSql(insert)
                            .then(_ => console.log(`Inserted ${index}`))
                            .catch(e => console.log(`Cound not insert code:${e.code} '${e.message}'`));
                    }
                );
                // const rowsToInsert = data.map(_ => "(?)").join(", ");
                // const valuesToInsert = data.map((book, index) => {
                //     const banner = `${baseUrl}${book.attributes.images_banner}`;
                //     const thumb = `${baseUrl}${book.attributes.images_thumbnail}`;
                //     return `${index}, "${book.name}", "${book.attributes.overview_author}", ${book.rate}, "${book.tags}", "${banner}", "${thumb}"`;
                // });
                // const insertStatement = `insert into Ebooks(book_id, name, author, rating, tags, bannerUrl, thumbnailUrl) values (?)`;
                // tx.executeSql(insertStatement, valuesToInsert)
                //     .then(_ => console.log(`Inserted all rows.`))
                //     .catch(e => console.log(`Cound not insert code:${e.code} '${e.message}'`));
            });
    }
    displayContents = (x: any) => {
        const db = dbInstance;
        console.log("ready to set the state");
        const promise = db.executeSql("select book_id, name, author, rating, tags, bannerUrl, thumbnailUrl from Ebooks")
            .then(s => {
                const rows = s[0].rows;
                const result = new Array(rows.length)
                    .fill(0)
                    .map((_, index) => rows.item(index))
                    .map<BookSummary>(item => ({
                        id: item.book_id,
                        name: item.name,
                        author: item.author,
                        rate: item.rating,
                        banner: item.bannerUrl,
                        thumbnail: item.thumbnailUrl,
                        tags: item.tags
                    }));
                this.setState({ ...this.state, books: result });
            });

        return promise;
    }
}

AppRegistry.registerComponent('pouchBooks', () => App);
