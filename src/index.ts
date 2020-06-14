import {
    DefaultDataFactory,
    isDefaultGraph, isQuadGraph,
    Quad, QuadGraph,
    QuadGraphLike,
    QuadSubject
} from "@opennetwork/rdf-data-model"
import * as ns from "./namespace"
import { literal } from "@opennetwork/rdf-namespace-javascript"

export interface TransactionOptions {
    context?: QuadGraphLike
    skip?: (quad: Quad, context: QuadGraph) => boolean | Promise<boolean>
    header?: (id: QuadSubject, quad: Quad, context: QuadGraph) => AsyncIterable<Quad> | Iterable<Quad>
    footer?: (id: QuadSubject, quad: Quad, context: QuadGraph) => AsyncIterable<Quad> | Iterable<Quad>
}

export function transaction(options: TransactionOptions): ((input: AsyncIterable<Quad>) => AsyncIterable<Quad>) {
    const context = options.context ? DefaultDataFactory.fromTerm(options.context) : ns.transaction
    if (!isQuadGraph(context)) {
        throw new Error("Invalid context")
    }
    return async function *transaction(input: AsyncIterable<Quad>): AsyncIterable<Quad> {
        for await (const quad of input) {
            if (options.skip) {
                if (await options.skip(quad, context)) {
                    continue
                }
            }
            const id = DefaultDataFactory.blankNode()
            yield new Quad(id, ns.type, ns.transaction, context)
            yield new Quad(id, ns.subject, quad.subject, context)
            yield new Quad(id, ns.predicate, quad.predicate, context)
            yield new Quad(id, ns.object, quad.object, context)
            yield new Quad(id, ns.graph, isDefaultGraph(quad.graph) ? ns.defaultGraph : quad.graph, context)
            yield new Quad(id, ns.timestamp, literal(new Date()), context)
            if (options.header) {
                yield* options.header(id, quad, context)
            }
            yield quad
            if (options.footer) {
                yield* options.footer(id, quad, context)
            }
        }
    }
}
