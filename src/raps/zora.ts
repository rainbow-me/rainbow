import { fetchContractABI } from "@/utils/ethereumUtils";
import { Contract } from "@ethersproject/contracts";
import zoraFactoryABI from './ZoraFactory.json'
import { parseAbi } from 'viem'
const zoraDrop = new Contract('0xF74B146ce44CC162b601deC3BE331784DB111DC1', zoraFactoryABI)
import * as wagmi from '../generated'

const abi = zoraFactoryABI as const 

useN
const viemDrop = parseAbi(wagmi.zoraNftCreatorABI)



const createZoraDrop = async (
   {network, config,  }:
    {network: string}
   
  ): Promise<any> => {
    const ensContract = contract ?? (await getENSRegistrarControllerContract());
    return ensContract.rentPrice(name, duration);
  };