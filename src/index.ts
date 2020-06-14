import {
    DefaultDataFactory,
    isDefaultGraph, isQuadGraph,
    Quad, QuadGraph,
    QuadGraphLike, QuadObject,
    QuadSubject
} from "@opennetwork/rdf-data-model"
import * as ns from "./namespace"
import { literal } from "@opennetwork/rdf-namespace-javascript"

export interface TransactionOptions {
    context?: QuadGraphLike
    quadHeader?: (id: QuadSubject, context: QuadGraph, quad: Quad) => AsyncIterable<Quad> | Iterable<Quad>
    quadFooter?: (id: QuadSubject, context: QuadGraph, quad: Quad) => AsyncIterable<Quad> | Iterable<Quad>
    header?: (id: QuadSubject, context: QuadGraph) => AsyncIterable<Quad> | Iterable<Quad>
    footer?: (id: QuadSubject, context: QuadGraph) => AsyncIterable<Quad> | Iterable<Quad>
    defaultGraph?: QuadObject
}

function getContext(options: TransactionOptions): QuadGraph {
    const context = options.context ? DefaultDataFactory.fromTerm(options.context) : ns.transaction
    if (!isQuadGraph(context)) {
        throw new Error("Invalid context")
    }
    return context
}

export async function *transact(options: TransactionOptions, source: (id: QuadSubject) => AsyncIterable<Quad>): AsyncIterable<Quad> {
    const context = getContext(options)
    const id = DefaultDataFactory.blankNode()
    yield new Quad(id, ns.type, ns.transaction, context)
    yield new Quad(id, ns.timestamp, literal(new Date()), context)
    if (options.header) {
        yield* options.header(id, context)
    }
    for await (const quad of source(id)) {
        const quadId = DefaultDataFactory.blankNode()
        yield new Quad(id, ns.quad, quadId, context)
        yield new Quad(quadId, ns.type, ns.quad, context)
        yield new Quad(quadId, ns.quadSubject, quad.subject, context)
        yield new Quad(quadId, ns.quadPredicate, quad.predicate, context)
        yield new Quad(quadId, ns.quadObject, quad.object, context)
        yield new Quad(quadId, ns.quadGraph, isDefaultGraph(quad.graph) ? (options.defaultGraph || ns.quadDefaultGraph) : quad.graph, context)
        yield new Quad(quadId, ns.timestamp, literal(new Date()), context)
        if (options.quadHeader) {
            yield* options.quadHeader(quadId, context, quad)
        }
        yield quad
        if (options.quadFooter) {
            yield* options.quadFooter(quadId, context, quad)
        }
    }
    if (options.footer) {
        yield* options.footer(id, context)
    }
}

export function transaction(options: TransactionOptions): ((input: AsyncIterable<Quad>) => AsyncIterable<Quad>) {
    const context = getContext(options)
    return async function *transaction(input: AsyncIterable<Quad>): AsyncIterable<Quad> {
        yield* transact(
            {
                ...options,
                context
            },
            async function *source() {
                yield* input
            }
        )
    }
}
