import * as ns from "../namespace";
import { QuadObject } from "@opennetwork/rdf-data-model";
import {predicate, Type, type} from "./descriptor";

const timestampPredicate = predicate<Date, "timestamp", typeof ns.timestamp>({
    name: "timestamp",
    predicate: ns.timestamp
})
const completionPredicate = predicate<Date, "completion", typeof ns.completion>({
    name: "completion",
    predicate: ns.completion
})
const quadPredicate = predicate<QuadObject, "quad", typeof ns.quad>({
    name: "quad",
    predicate: ns.quad
})

export const transaction = type(
    completionPredicate(
        quadPredicate(
            timestampPredicate(
                ({
                    [Type]: ns.transaction
                })
            )
        )
    )
)
