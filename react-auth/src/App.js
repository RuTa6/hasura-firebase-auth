import gql from "graphql-tag";
import React from "react";
import {
  createClient,
  Provider,
  defaultExchanges,
  subscriptionExchange,
  useQuery,
} from "urql";

export default function App({ authState }) {
  const PL_SUB = gql`
    query PL {
      programming_language(order_by: { vote_count: desc }) {
        name
        vote_count
      }
    }
  `;
  const [result, reexecuteQuery] = useQuery({
    query: PL_SUB,
  });
  console.log("res", result);
  return (
    <>
      {result?.data ? (
        result?.data?.programming_language?.map((p) => (
          <>
            <div>
              {p?.name} ==== {p?.vote_count}
            </div>
          </>
        ))
      ) : (
        <div>no result</div>
      )}
    </>
  );
}
