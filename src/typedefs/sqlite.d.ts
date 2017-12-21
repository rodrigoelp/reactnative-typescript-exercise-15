declare module "react-native-sqlite-storage" {
    export interface Error { // this interface should match es5 error.
        name: string;
        message: string;
        stack?: string;
    }

    export type SuccessCallback = () => void;
    export type SuccessDatabaseCallback = (db: Database) => void;
    export type SuccessStatementCallback = (result: Result) => void;
    export type ErrorCallback = (er: Error) => void;

    export interface Result {
        rowAffected: number;
        insertId?: number;
        rows: {
            lenght: number;
            item(index: number): any;
        };
    }

    export enum ErrorCode {
        Unknown = 0,
        Database = 1,
        Version = 2,
        Toolarge = 3,
        Quota = 4,
        Syntax = 5,
        Constraint = 6,
        Timeout = 7
    }

    export interface Transaction {
        executeSql(statement: string, params?: any[]): Promise<any>;
        // executeSql(statement: string, params?: any[], onSuccess?: (tx: Transaction, result: Result) => void, onError?: (tx: Transaction, error: Error) => void): void;
    }

    export interface Database {
        // executeSql(statement: string, params?: any[], onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
        // sqlBatch(statements: Array<string|[string, any[]]>, onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
        // transaction(fn: (tx: Transaction) => void, onError?: ErrorCallback, onSuccess?: SuccessCallback): void;
        // readTransaction(fn: (tx: Transaction) => void, onError?: ErrorCallback, onSuccess?: SuccessCallback): void;
        // close(onSuccess: SuccessCallback, onError?: ErrorCallback): void;
        executeSql(statement: string, params?: any[]): Promise<any[]>;
        sqlBatch(statements: Array<string | [string, any[]]>): Promise<any[]>;
        transaction(fn: (tx: Transaction) => void): Promise<any[]>;
        readTransaction(fn: (tx: Transaction) => void): Promise<any[]>;
        close(): Promise<any>; // gives you a status.

        abortAllPendingTransactions(): void;
        open(onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
        close(onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
        attach(name: string, alias: string, onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
        detach(alias: string, onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
    }

    export interface OpenParams {
        [key: string]: any;
        name: string;
        location?: string;
        createFromLocation?: string;
    }

    export interface DeleteParams {
        name: string;
        location?: string | any;
    }

    export function DEBUG(enable: boolean): void;
    export function enablePromise(enable: boolean): void;
    export function sqliteFeatures(): any;
    export function openDatabase(params: OpenParams): Promise<Database>;
    export function openDatabase(name: string, version: string, displayName: string, size: number, onOpen: SuccessCallback, onError: ErrorCallback): Database;
    export function deleteDatabase(args: string | DeleteParams): Promise<void>;
    export function deleteDatabase(args: string | DeleteParams, onSuccess: SuccessCallback, onError: ErrorCallback): void;

    export function selfTest(onSuccess?: SuccessCallback, onError?: ErrorCallback): void;
    export function echoTest(isItOk?: (value: string) => void, onError?: (msg: string) => void): void;
}

