import {DefaultDataFactory} from "@opennetwork/rdf-data-model";

// export const contains = DefaultDataFactory.namedNode("https://types.open-network.dev/aware-consumer/contains")

export const type = DefaultDataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type")
export const transaction = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction")
export const subject = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/subject")
export const predicate = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/predicate")
export const object = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/object")
export const graph = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/graph")
export const defaultGraph = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/default-graph")
export const timestamp = DefaultDataFactory.namedNode("https://types.open-network.dev/rdf-transaction/transaction/timestamp")
