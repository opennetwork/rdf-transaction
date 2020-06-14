import {DefaultDataFactory} from "@opennetwork/rdf-data-model";

// export const contains = DefaultDataFactory.namedNode("https://types.open-network.dev/aware-consumer/contains")

export const type = DefaultDataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
export const transaction = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction")
export const timestamp = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/timestamp")

export const quad = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/quad")
export const quadSubject = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/quad/subject")
export const quadPredicate = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/quad/predicate")
export const quadObject = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/quad/object")
export const quadGraph = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/quad/graph")
export const quadDefaultGraph = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/quad/default-graph")
