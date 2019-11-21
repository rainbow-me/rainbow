import { useState, useEffect } from 'react';
import { useQuery, useApolloClient } from '@apollo/react-hooks';
import { COMPOUND_MARKET_QUERY } from '../apollo/queries';


export function useSavingsAccount(/*arguments supplied to gql query*/) {
  const [compoundData, setCompoundData] = useState([]);
  const client = useApolloClient()

  useEffect(() => {
    const fetchCompoundData = async function(exchangeAddresses) {
     try {
        /*
          The argument exchangeAddresses is an array containing the tokens owned by current user
          We  need to iterate over the list of exchangeAddresses and run a query for Market data from
          each one and sae the data to be set using setCompoundData
        */
        const exchangeData = exchangeAddresses.map(async addr => {
          const response = await client.query({
            query: COMPOUND_MARKET_QUERY,
            variables: {
              exchangeAddr: addr, 
            },
          });

          if (!response.data) return;
          
          return response.data.markets;
        });
     } catch (error) {
         console.log('error: ', error);
     }
    }
  });

  return 
}