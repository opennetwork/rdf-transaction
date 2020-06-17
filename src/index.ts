import {
    DefaultDataFactory,
    DefaultGraph,
    isDefaultGraph,
    isQuad,
    isQuadGraph,
    Quad,
    QuadGraph,
    QuadObject,
    QuadSubject
} from "@opennetwork/rdf-data-model"
import * as ns from "./namespace"
import { asyncIterable } from "iterable"
import * as ds from "./descriptors"
import {ReadonlyDataset} from "@opennetwork/rdf-dataset";

export interface TransactionOptions {
    dataset?: ReadonlyDataset
    graph?: QuadGraph
    quadHeader?: (id: QuadSubject, graph: QuadGraph, quad: Quad) => AsyncIterable<Quad> | Iterable<Quad>
    quadFooter?: (id: QuadSubject, graph: QuadGraph, quad: Quad) => AsyncIterable<Quad> | Iterable<Quad>
    header?: (id: QuadSubject, graph: QuadGraph) => AsyncIterable<Quad> | Iterable<Quad>
    footer?: (id: QuadSubject, graph: QuadGraph) => AsyncIterable<Quad> | Iterable<Quad>
    defaultQuadGraph?: Exclude<QuadObject, DefaultGraph>
}

function getGraph(options: TransactionOptions): QuadGraph {
    const context = options.graph ? DefaultDataFactory.fromTerm(options.graph) : ns.transaction
    if (!isQuadGraph(context)) {
        throw new Error("Invalid context")
    }
    return context
}

export async function *transact(options: TransactionOptions, source: Quad | Iterable<Quad> | AsyncIterable<Quad> | ((id: QuadSubject) => AsyncIterable<Quad>)): AsyncIterable<Quad> {

    const graph: QuadGraph = getGraph(options)
    const transaction = ds.transaction({ dataset: options.dataset })
    yield* transaction.type()

    yield* transaction.timestamp(new Date())
    if (options.header) {
        yield* options.header(transaction.id, graph)
    }
    const iterable = typeof source === "function" ? source(transaction.id) : isQuad(source) ? asyncIterable([source]) : asyncIterable(source)
    for await (const instance of iterable) {
        const quad = ds.quad({ dataset: options.dataset })
        yield* quad.type()
        yield* transaction.quad(quad.id)
        yield* quad.subject(instance.subject)
        yield* quad.predicate(instance.predicate)
        yield* quad.object(instance.object)
        if (isDefaultGraph(instance.graph)) {
            if (isQuadGraph(options.defaultQuadGraph)) {
                yield* quad.graph(options.defaultQuadGraph)
            } else {
                yield* quad.graph(ns.quadDefaultGraph)
            }
        } else {
            yield* quad.graph(instance.graph)
        }
        yield* quad.timestamp(new Date())
        if (options.quadHeader) {
            yield* options.quadHeader(quad.id, graph, instance)
        }
        yield instance
        if (options.quadFooter) {
            yield* options.quadFooter(quad.id, graph, instance)
        }
        yield* quad.completion(new Date())
    }
    if (options.footer) {
        yield* options.footer(transaction.id, graph)
    }
    yield* transaction.completion(new Date())
}

export function transaction(options: TransactionOptions): ((input: AsyncIterable<Quad>) => AsyncIterable<Quad>) {
    const graph = getGraph(options)
    return transact.bind(undefined, {
        ...options,
        graph
    })
}
