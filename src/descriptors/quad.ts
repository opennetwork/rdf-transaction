import * as ns from "../namespace";
import { DefaultGraph, QuadGraph, QuadObject, QuadPredicate, QuadSubject } from "@opennetwork/rdf-data-model";
import {predicate, Type, type} from "./descriptor";

const timestampPredicate = predicate<Date, "timestamp", typeof ns.timestamp>({
    name: "timestamp",
    predicate: ns.timestamp
})
const completionPredicate = predicate<Date, "completion", typeof ns.completion>({
    name: "completion",
    predicate: ns.completion
})
const quadSubjectPredicate = predicate<QuadSubject, "subject", typeof ns.quadSubject>({
    name: "subject",
    predicate: ns.quadSubject
})
const quadPredicatePredicate = predicate<QuadPredicate, "predicate", typeof ns.quadPredicate>({
    name: "predicate",
    predicate: ns.quadPredicate
})
const quadObjectPredicate = predicate<QuadObject, "object", typeof ns.quadObject>({
    name: "object",
    predicate: ns.quadObject
})
const quadGraphPredicate = predicate<Exclude<QuadGraph, DefaultGraph>, "graph", typeof ns.quadGraph>({
    name: "graph",
    predicate: ns.quadGraph
})

export const quad = type(
    completionPredicate(
        quadSubjectPredicate(
            quadPredicatePredicate(
                quadObjectPredicate(
                    quadGraphPredicate(
                        timestampPredicate(
                            ({
                                [Type]: ns.transaction
                            })
                        )
                    )
                )
            )
        )
    )
)
