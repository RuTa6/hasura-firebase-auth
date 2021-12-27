import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import React, { useState, useEffect } from "react";
import App from "./App";
import {
  createClient,
  Provider,
  defaultExchanges,
  subscriptionExchange,
  useQuery,
} from "urql";
const provider = new firebase.auth.GoogleAuthProvider();

firebase.initializeApp({
  apiKey: "AIzaSyDonGqw8WpdJoqE9kzJ8FCEYQzsqq-fLC8",
  authDomain: "auth-poc-76c33.firebaseapp.com",
  databaseURL: "https://auth-poc-76c33-default-rtdb.firebaseio.com/",
  projectId: "auth-poc-76c33",
  storageBucket: "auth-poc-76c33.appspot.com",
  messagingSenderId: "401915582503",
});

export default function Auth() {
  const [authState, setAuthState] = useState({ status: "loading" });
  console.log(authState);
  const isIn = authState.status === "in";

  const headers = isIn
    ? { Authorization: `Bearer ${authState.token}`, "x-hasura-role": "user" }
    : {};
  //create hasura client using urql
  const client = createClient({
    url: "https://full-kodiak-57h.hasura.app/v1/graphql",
    requestPolicy: "network-only",
    fetchOptions: () => {
      return {
        headers,
      };
    },
  });

  useEffect(() => {
    return firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        console.log("token", token);
        const idTokenResult = await user.getIdTokenResult();
        console.log("id token result", idTokenResult);
        const hasuraClaim =
          idTokenResult.claims["https://hasura.io/jwt/claims"];

        console.log("hasura claim", hasuraClaim);
        if (hasuraClaim) {
          setAuthState({ status: "in", user, token });
        } else {
          // Check if refresh is required.
          const metadataRef = firebase
            .database()
            .ref("metadata/" + user.uid + "/refreshTime");

          metadataRef.on("value", async (data) => {
            if (!data.exists) {
              return;
            }
            // Force refresh to pick up the latest custom claims changes.
            // Note this is always triggered on first call. Further optimization could be
            // added to avoid the initial trigger when the token is issued and already contains
            // the latest claims.
            const token = await user.getIdToken(true);
            console.log("token2", token);
            setAuthState({ status: "in", user, token });
          });
        }
      } else {
        setAuthState({ status: "out" });
      }
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (error) {
      console.log(error);
    }
  };

  const signOut = async () => {
    try {
      setAuthState({ status: "loading" });
      await firebase.auth().signOut();
      setAuthState({ status: "out" });
    } catch (error) {
      console.log(error);
    }
  };

  let content;
  if (authState.status === "loading") {
    content = null;
  } else {
    content = (
      <>
        <Provider value={client}>
          <div>
            {authState.status === "in" ? (
              <div>
                <h2>Welcome, {authState.user.displayName}</h2>
                <button onClick={signOut}>Sign out</button>
              </div>
            ) : (
              <button onClick={signInWithGoogle}>Sign in with Google</button>
            )}
          </div>

          <App authState={authState} />
        </Provider>
      </>
    );
  }

  return <div className="auth">{content}</div>;
}
