import React, { useContext, createContext } from "react";
import {
  useAddress,
  useContract,
  useMetamask,
  useDisconnect,
  useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { parse } from "@ethersproject/transactions";
import { EditionMetadataWithOwnerOutputSchema } from "@thirdweb-dev/sdk";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    "0x46edE4f590dE7dd7fE61fDF1556caFc9Fa83Ba7E"
  );

  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();

  const connect = useMetamask();

  const disconnect = useDisconnect();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign([
        address, // caller
        form.title,
        form.description,
        form.target,
        new Date(form.deadline).getTime(),
        form.image,
      ]);
      console.log("Contract call success", data);
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call("getCampaigns");
    const parsedCampaigns = campaigns.map((campaign, index) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      image: campaign.image,
      id: index,
    }));

    console.log(parsedCampaigns);

    return parsedCampaigns.reverse();
  };

  const getCampaignById = async (id) => {
    const parsedId = Number(id);
    if (parsedId === "NaN") return false;
    const campaign = await contract.call("getCampaignById", parsedId);
    if (campaign.owner === "0x0000000000000000000000000000000000000000")
      return false;
    return {
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      image: campaign.image,
      id: id,
    };
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );
    return filteredCampaigns;
  };

  const getCampaignCount = async () => {
    const count = await contract.call("campaignCount");
    return count;
  };

  const getUserCampaignCount = async (owner) => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === owner
    );
    return filteredCampaigns.length;
  };

  const donate = async (id, amount) => {
    const data = await contract
      .call("donateToCampaign", id, {
        value: ethers.utils.parseEther(amount),
      })
      .catch((e) => false);

    return data;
  };

  const getDonations = async (pId) => {
    const donations = await contract.call("getDonators", pId);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      });
    }

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        disconnect,
        getCampaigns,
        getUserCampaigns,
        getUserCampaignCount,
        createCampaign: publishCampaign,
        donate,
        getDonations,
        getCampaignById,
        getCampaignCount,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
