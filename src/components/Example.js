import React, { useState, useEffect } from 'react';
import { COMPOUND_MARKET_QUERY } from '../apollo/queries';
import { useQuery, useApolloClient } from '@apollo/react-hooks';


const Example = ({...props}) => {
    const { loading, error, data } = useQuery(COMPOUND_MARKET_QUERY);
    console.log('loading  ', loading)
    console.log('data ', data)
    return (
        <>
            {Array.from(data)}

        </>
    );
};

export default Example;