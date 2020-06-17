import { Dataset } from "@opennetwork/rdf-dataset"
import { transform } from "@opennetwork/rdf-transform"
import { transact } from "../esnext/index.js"

async function *thing() {
  yield 1
}

const dataset = new Dataset()

dataset.import(transact({ }, transform(thing, {
  literalQuad: {
    subject: {
      termType: "BlankNode",
      value: "a"
    }
  },
  profileQuad: true
})))
  .then(() => {
    console.log(JSON.stringify(dataset.toArray(), undefined, "  "))
  })
  .catch(console.error)
