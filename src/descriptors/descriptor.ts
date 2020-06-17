import {
    DefaultDataFactory,
    isQuadGraph,
    isQuadObject,
    isQuadPredicate,
    isQuadSubject,
    NamedNode,
    Quad,
    QuadGraph,
    QuadObject,
    QuadPredicate,
    QuadPredicateLike,
    QuadSubject
} from "@opennetwork/rdf-data-model"
import * as ns from "../namespace"
import {ReadonlyDataset} from "@opennetwork/rdf-dataset";
import {literal, isLiteralInput, LiteralInput} from "@opennetwork/rdf-namespace-javascript"

export const Type = Symbol("Type")
export const Graph = Symbol("Graph")

export interface Type<N extends NamedNode> {
    [Type]: N
}

export interface IdType extends Type<NamedNode> {
    id: QuadSubject
}

export interface GraphType extends Type<NamedNode> {
    [Graph]: QuadGraph
}

export interface TypeFnOptions {
    subject?: QuadSubject
    graph?: QuadGraph
    dataset?: ReadonlyDataset
}

export interface TypeFn<N extends NamedNode, T extends Type<N>> {
    (subjectOrOptions?: QuadSubject | TypeFnOptions): T & IdType & GraphType & TypePredicate<N, T>
}

export interface PredicateResolveOptions<O extends (LiteralInput | QuadObject) = (LiteralInput | QuadObject)> {
    graph?: QuadGraph
    subject?: QuadSubject
    dataset?: ReadonlyDataset
    object?: O
}

export interface PredicateResolveFn<T extends Type<NamedNode>, N extends string, P extends QuadPredicate, O extends (LiteralInput | QuadObject) = (LiteralInput | QuadObject)> {
    (options?: PredicateResolveOptions<O>): AsyncIterable<Quad>
    (input: O, options?: PredicateResolveOptions<O>): AsyncIterable<Quad>
}

export type Predicate<T extends Type<NamedNode>, N extends string, P extends QuadPredicate, O extends (LiteralInput | QuadObject) = (LiteralInput | QuadObject)> = T & {
    [K in N]: PredicateResolveFn<T, N, P, O> & {
        knownAs: QuadPredicate
        options(inputOrOptions?: O | PredicateResolveOptions<O>): ResolvedPredicateResolveOptions
    }
}

export type TypePredicate<N extends NamedNode, T extends Type<N>> = Predicate<T, "type", typeof ns.type, N>

export interface PredicateFn<N extends string, P extends QuadPredicate, O extends (LiteralInput | QuadObject) = (LiteralInput | QuadObject)> {
    <T extends Type<NamedNode>>(type: T): Predicate<T, N, P, O>
}

export interface PredicateTemplateOptions<N extends string, P extends QuadPredicate> {
    name: N
    predicate: P
    graph?: QuadGraph
    dataset?: ReadonlyDataset
    object?: LiteralInput | QuadObject
}

function isPredicate(value: unknown): value is Predicate<Type<NamedNode>, string, QuadPredicate, LiteralInput | QuadObject> {
    function isPredicateLike(value: unknown): value is { knownAs: unknown } {
        return typeof value === "function"
    }
    return (
        isPredicateLike(value) &&
        isQuadPredicate(value.knownAs)
    )
}

export function isIdType(type: Type<NamedNode>): type is IdType {
    function isIdTypeLike(type:  unknown): type is { id: unknown } {
        return !!type
    }
    return (
        isIdTypeLike(type) &&
        isQuadSubject(type.id)
    )
}

export function isGraphType(type: Type<NamedNode>): type is GraphType {
    function isIdTypeLike(type:  unknown): type is { [Graph]: unknown } {
        return !!type
    }
    return (
        isIdTypeLike(type) &&
        isQuadGraph(type[Graph])
    )
}

export function type<N extends NamedNode, T extends Type<N>>(type: T): TypeFn<N, T> {
    type OutputType = T & IdType & GraphType & TypePredicate<N, T>
    return (subjectOrOptions?: QuadSubject | TypeFnOptions): OutputType => {
        const { subject = DefaultDataFactory.blankNode(), graph: graphValue = DefaultDataFactory.defaultGraph(), dataset = undefined } = isQuadSubject(subjectOrOptions) ? {
            subject: subjectOrOptions
        } : (subjectOrOptions || {})

        const typePredicate = predicate<N, "type", typeof ns.type>({
            name: "type",
            predicate: ns.type,
            object: type[Type]
        })

        const instance: OutputType = typePredicate({
            ...type,
            id: subject,
            [Graph]: graphValue
        })

        const handlers: ProxyHandler<OutputType> = {
            get(target, prop, receiver) {
                const initialValue = Reflect.get(target, prop, receiver)
                const typeValue = Reflect.get(type, prop, receiver)
                const predicate = initialValue || typeValue
                if (!isPredicate(predicate)) {
                    return predicate
                }
                return predicateResolve

                function predicateResolve<O>(inputOrOptions?: O | PredicateResolveOptions): AsyncIterable<Quad> {
                    return predicate(getOptions(inputOrOptions))

                    function getOptions(value?: O | PredicateResolveOptions): PredicateResolveOptions {
                        if (isLiteralInput(value)) {
                            return getOptions({
                                object: value,
                                graph: graphValue
                            })
                        }
                        if (isQuadObject(value)) {
                            return getOptions({
                                object: value,
                                graph: graphValue
                            })
                        }
                        return predicate.options({
                            graph: graphValue,
                            dataset,
                            ...value,
                            subject: instance.id
                        })
                    }
                }

            }
        }

        return new Proxy(instance, handlers)
    }
}

type ResolvedPredicateResolveOptions = Omit<PredicateResolveOptions, "subject" | "graph"> & { subject: QuadSubject, graph: QuadGraph }

export function predicate<O extends (LiteralInput | QuadObject), N extends string, P extends QuadPredicate>({ name, predicate, graph: predicateGraph, dataset: predicateDataset, object: predicateObject }: PredicateTemplateOptions<N, P>): PredicateFn<N, P, O> {
    return <T extends Type<NamedNode>>(type: T): T & Predicate<T, N, P, O> => {
        const predicateProto = {
            [name]: predicateResolve
        }

        Object.defineProperty(predicateProto[name], "knownAs", {
            value: predicate,
            writable: false
        })

        Object.defineProperty(predicateProto[name], "name", {
            value: name,
            writable: false
        })

        Object.defineProperty(predicateProto[name], "options", {
            value: getOptions,
            writable: false
        })

        if (!isPredicateProto(predicateProto, name)) {
            throw new Error("Typescript please")
        }

        return {
            ...type,
            ...predicateProto
        }

        async function *predicateResolve(inputOrOptions?: O | PredicateResolveOptions): AsyncIterable<Quad> {
            const { graph, subject, object } = getOptions(inputOrOptions)
            if (isQuadObject(object)) {
                return yield new Quad(subject, predicate, object, graph)
            } else if (isLiteralInput(object)) {
                return yield new Quad(subject, predicate, literal(object), graph)
            }
        }

        function getOptions(inputOrOptions?: O | PredicateResolveOptions): ResolvedPredicateResolveOptions {
            if (isLiteralInput(inputOrOptions)) {
                return resolveOptions({
                    object: inputOrOptions
                })
            }
            if (isQuadObject(inputOrOptions)) {
                return resolveOptions({
                    object: inputOrOptions
                })
            }
            const options = inputOrOptions || {}
            if (!isPredicateResolveOptions(options)) {
                throw new Error("Typescript please")
            }
            return resolveOptions(options)

            function isPredicateResolveOptions(value: unknown): value is PredicateResolveOptions {
                return !!value
            }

            function resolveOptions(options: PredicateResolveOptions): ResolvedPredicateResolveOptions {
                return {
                    ...options,
                    object: options.object || predicateObject,
                    subject: getSubject(options.subject),
                    graph: getGraph(options.graph),
                    dataset: options.dataset || predicateDataset
                }
            }
        }

        function isPredicateProto(value: Record<string, unknown>, name: N): value is Predicate<T, N, P, O> & QuadPredicateLike {
            function isPredicateLike(fn: unknown): fn is { knownAs: unknown } {
                return typeof fn === "function"
            }
            const fn = value[name]
            return !!(
                isPredicateLike(fn) &&
                fn.knownAs &&
                isQuadPredicate(fn.knownAs)
            )
        }

        function getSubject(givenSubject?: QuadSubject): QuadSubject {
            if (givenSubject) {
                return givenSubject
            }
            if (isIdType(type)) {
                return type.id
            }
            throw new Error("Subject unknown")
        }

        function getGraph(givenGraph?: QuadGraph): QuadGraph {
            if (givenGraph) {
                return givenGraph
            }
            if (isGraphType(type)) {
                return type[Graph]
            }
            if (predicateGraph) {
                return predicateGraph
            }
            throw new Error("Graph unknown")
        }
    }
}
