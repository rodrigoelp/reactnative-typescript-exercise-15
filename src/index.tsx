import * as React from "react";
import { AppRegistry, StatusBar, View, Image, Text, Platform, StyleSheet, FlatList, Button, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import * as sqlite from "react-native-sqlite-storage";
import { Database, OpenParams, Result, ErrorCode } from "react-native-sqlite-storage";
import { Book, BookAttributes, BookSummary } from "./models";
import { getFirstResultFrom } from "./services";
import { getDeviceInfo } from "./deviceInfo";

sqlite.DEBUG(true);
sqlite.enablePromise(true);

// this is the global instance of the database (as an example, find a better place to keep the database reference)
let dbInstance: Database;
// base url to query my json resources.
const baseUrl = "https://raw.githubusercontent.com/rodrigoelp/reactnative-typescript-exercise-15/master/onlineCatalog/";

// Getting an isntance of the device information to optimise the status bar rendering based on the device.
const deviceInfo = getDeviceInfo();

type DatabaseWithData = { database: Database, isPopulated: boolean };

// state of the app component.
interface AppState {
    books: BookSummary[];
    refreshing: boolean;
}

// This is the component we are going to be working on.
// It does not reflex anything you should be following, is just a sample on how to get the database working and how to extra data from it.
class App extends React.Component<{}, AppState> {
    constructor(props: any) {
        super(props);

        // When the application first lauches, the known state should be empty, this will be populated later on when the component is mounted.
        this.state = { books: [], refreshing: false };
    }

    componentDidMount() {
        // Hope the chain of promises and cascade of methods is self explanatory.
        // If anything bad were to happen, it should be caught by the last condition and display
        // a message to the user.
        this.initDbConnection()
            .then(this.createDatabase)
            .then(this.checkIfBooksHaveBeenDownloaded)
            .then(this.downloadContentIfRequired)
            .then(this.displayContents)
            .catch(e => {
                const code = e.code as number;
                const msg = `App needs to display an error message here. Received an reason (${code}) and message: ${e.message}`;
                console.log(msg);
                Alert.alert("Something very very bad just happened.", msg);
            });
    }

    componentWillUnmount() {
        // Now... when the component is going to be unmounted, we need to do a little clean up.
        if (dbInstance) {
            dbInstance.close();
        }
    }

    public render() {
        return (
            <View style={{ flex: 1, backgroundColor: "#eeeeff" }}>
                <View style={{ height: deviceInfo.statusBarHeight }} />
                <FlatList
                    data={this.state.books}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={({ item }) => this.renderBook(item)}
                    refreshControl={<RefreshControl onRefresh={this.handleRefresh} refreshing={this.state.refreshing} />}
                    ItemSeparatorComponent={this.renderSeparator}
                />
            </View>
        );
    }

    renderSeparator = () => {
        return (
            <View style={{ height: 1, backgroundColor: "gray", marginHorizontal: 40 }} />
        );
    }

    renderBook = (book: BookSummary) => {
        return (
            <View style={{ flex: 1, padding: 20, flexDirection: "row" }}>
                <Image source={{ uri: book.thumbnail, height: 80, width: 80 }} />
                <View style={{ flex: 1, alignContent: "center" }}>
                    <Text style={{ flex: 1, textAlign: "center", textAlignVertical: "center" }}>{book.name}</Text>
                    <Text style={{ flex: 1, textAlign: "center" }}>By: {book.author}</Text>
                    <Text style={{ flex: 1, textAlign: "right" }}>Rating: {book.rate} / 5</Text>
                </View>
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
        return db.executeSql(script)
            .then(_ => db);
    }

    checkIfBooksHaveBeenDownloaded = (db: Database): Promise<DatabaseWithData> => {
        return db.executeSql("select count(*) as numberOfBooks from Ebooks")
            .then(r => {
                type queryType = { numberOfBooks: number };
                const result = getFirstResultFrom<queryType, queryType>(r, x => x);
                return { database: db, isPopulated: result.length === 1 && result.items[0].numberOfBooks > 0 };
            });
    }

    downloadContentIfRequired = (result: DatabaseWithData) => {
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

                // Unfortunately, this mapping does not seem to work in my code :(
                // Maybe the type definition is incorrect.

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
                type ebookDataModel = { book_id: number, name: string, author: string, rating: number, tags: string, bannerUrl: string, thumbnailUrl: string };
                const books = getFirstResultFrom<ebookDataModel, BookSummary>(s, i => ({
                    id: i.book_id,
                    name: i.name,
                    author: i.author,
                    rate: i.rating,
                    banner: i.bannerUrl,
                    thumbnail: i.thumbnailUrl,
                    tags: i.tags
                }));

                this.setState({ ...this.state, books: books.items });
            });

        return promise;
    }

    handleRefresh = () => {
        // On refresh, we will destroy the database, redownload the content and reinserted.
        const db = dbInstance;
        const emptyDb: DatabaseWithData = { database: db, isPopulated: false };
        this.setState({ ...this.state, refreshing: true });
        db.executeSql("delete from Ebooks")
            .then(_ => { // intentionally adding a delay to see it happen on the device.
                return new Promise<void>((resolve, reject) => {
                    setTimeout(() => resolve(), 3000);
                });
            })
            .then(_ => emptyDb)
            .then(this.downloadContentIfRequired)
            .then(this.displayContents)
            .then(_ => this.setState({ ...this.state, refreshing: false }))
            .catch(e => {
                console.log("I really need to include something to handle my errors");
            });
    }
}

AppRegistry.registerComponent('pouchBooks', () => App);
