export interface Result<X> {
    length: number;
    items: X[];
}

export type Mapper<A, B> = (input: A) => B;

export interface DbResult {
    rowAffected: number;
    insertId?: number;
    rows: {
        length: number;
        item(index: number): any;
    };
}

export function getFirstResultFrom<TInput, TOutput>(input: DbResult[], mapping: Mapper<TInput, TOutput>): Result<TOutput> {
    if (input != undefined && input.length > 0) {
        return mapToResult(input[0], mapping);
    }
    return { length: 0, items: [] };
}

export function mapToResult<TInput, TOutput>(input: DbResult, mapping: Mapper<TInput, TOutput>): Result<TOutput> {
    const length = input.rows.length;
    if (length > 0) {
        const items = new Array(length)
            .fill(0)
            .map((_, i) => (input.rows.item(i) as TInput))
            .map(mapping);
        return { length, items };
    }
    return { length: 0, items: [] };
}