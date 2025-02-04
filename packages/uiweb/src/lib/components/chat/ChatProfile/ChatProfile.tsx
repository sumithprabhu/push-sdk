// @typescript-eslint/no-non-null-asserted-optional-chain

import { useContext, useEffect, useRef, useState } from "react";
import { Image, Section, Span } from "../../reusables";
import styled from "styled-components";
import TokenGatedIcon from '../../../icons/Token-Gated.svg';
import PublicChatIcon from '../../../icons/Public-Chat.svg';
import VideoChatIcon from '../../../icons/VideoCallIcon.svg';
import GreyImage from '../../../icons/greyImage.png';
import InfoIcon from '../../../icons/infodark.svg';
import VerticalEllipsisIcon from '../../../icons/VerticalEllipsis.svg';
import type { IUser } from '@pushprotocol/restapi';
import { useChatData, useClickAway, useDeviceWidthCheck } from "../../../hooks";
import { ThemeContext } from "../theme/ThemeProvider";
import { IChatTheme } from "../theme";
import { pCAIP10ToWallet, resolveEns, resolveNewEns, shortenText } from "../../../helpers";
import useGetGroupByID from "../../../hooks/chat/useGetGroupByID";
import useChatProfile from "../../../hooks/chat/useChatProfile";
import { IGroup } from "../../../types";
import { GroupInfoModal } from "./GroupInfoModal";
import { isValidETHAddress } from "../helpers/helper";
import { ethers } from "ethers";
import { IChatProfile, IToast, OptionProps } from "../exportedTypes";
import { InfuraAPIKey, allowedNetworks, device } from "../../../config";
import Toast from "../helpers/Toast";
import useMediaQuery from "../../../hooks/useMediaQuery";
import { createBlockie } from "../../space/helpers/blockies";
// import { NewToast } from "../helpers/NewToast";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';



const Options = ({ options, setOptions, isGroup, chatInfo, groupInfo, setGroupInfo, theme }: OptionProps) => {
    const DropdownRef = useRef(null);
    const [modal, setModal] = useState(false);

    useClickAway(DropdownRef, () => {
        setOptions(false);
    });

    const ShowModal = () => {
        setModal(true);
    }
    console.log(groupInfo?.rules?.chat, "groupInfooo")

    if (groupInfo && isGroup) {
        return (
            <Section zIndex="300" flexDirection="row" gap="10px" margin="0 20px 0 auto">
                {
                    (groupInfo?.rules?.chat?.conditions || groupInfo?.rules?.entry?.conditions) && (
                        <Image src={TokenGatedIcon} height="28px" maxHeight="32px" width={'auto'} />
                    )
                }

                {groupInfo?.isPublic &&
                    (<Image src={PublicChatIcon} height="28px" maxHeight="32px" width={'auto'} />)}

                <ImageItem onClick={() => setOptions(true)}>
                    <Image src={VerticalEllipsisIcon} height="21px" maxHeight="32px" width={'auto'} cursor="pointer" />

                    {options &&
                        (<DropDownBar theme={theme} ref={DropdownRef}>
                            <DropDownItem cursor='pointer' onClick={ShowModal}>
                                <Image src={InfoIcon} height="21px" maxHeight="21px" width={'auto'} cursor="pointer" />

                                <TextItem>
                                    Group Info
                                </TextItem>
                            </DropDownItem>
                        </DropDownBar>)}

                    {modal &&
                        (<GroupInfoModal
                            theme={theme}
                            modal={modal}
                            setModal={setModal}
                            groupInfo={groupInfo}
                            setGroupInfo={setGroupInfo}
                        />)}
                </ImageItem>
            </Section>
        )
    } else {
        return null
    }
};





export const ChatProfile: React.FC<IChatProfile> = ({ chatId, style }: { chatId: string, style: "Info" | "Preview" }) => {
    const theme = useContext(ThemeContext);
    const { account, env } = useChatData();
    const { getGroupByID } = useGetGroupByID();
    const { fetchUserChatProfile } = useChatProfile();

    const [isGroup, setIsGroup] = useState<boolean>(false);
    const [options, setOptions] = useState(false);
    const [chatInfo, setChatInfo] = useState<IUser | null>();
    const [groupInfo, setGroupInfo] = useState<IGroup | null>();
    const [ensName, setEnsName] = useState<string | undefined>('');
    const isMobile = useMediaQuery(device.tablet);
    const l1ChainId = allowedNetworks[env].includes(1) ? 1 : 5;
    const provider = new ethers.providers.InfuraProvider(l1ChainId, InfuraAPIKey);



    const fetchProfileData = async () => {
        if (isValidETHAddress(chatId)) {
            const ChatProfile = await fetchUserChatProfile({ profileId: chatId });
            setChatInfo(ChatProfile);
            setGroupInfo(null);
            setIsGroup(false);
        } else {
            const GroupProfile = await getGroupByID({ groupId: chatId })
            setGroupInfo(GroupProfile);
            setChatInfo(null);
            setIsGroup(true);
        }
    }

    const getName = async (chatId: string) => {
        if (isValidETHAddress(chatId)) {
            const result = await resolveNewEns(chatId, provider);
            // if(result) 
            setEnsName(result);
        }
    }


    useEffect(() => {
        if (!chatId) return;
        fetchProfileData();
        getName(chatId);
    }, [chatId, account, env])

    if (chatId && style === 'Info') {
        return (
            <Container theme={theme}>
                {chatInfo || groupInfo ? (
                    <Image src={isGroup ? groupInfo?.groupImage ?? GreyImage : chatInfo?.profile?.picture ?? createBlockie?.(chatId)?.toDataURL()
                        ?.toString()} height="48px" maxHeight="48px" width='48px' borderRadius="100%" />
                ) : (<Image src={createBlockie?.(chatId)?.toDataURL()
                    ?.toString()} height="48px" maxHeight="48px" width='48px' borderRadius="100%" />)}


                <Span color={theme.textColor?.chatProfileText} fontSize="17px" margin="0 0 0 10px">
                    {isGroup ? groupInfo?.groupName : ensName ? `${ensName} (${isMobile ? shortenText(chatInfo?.did?.split(':')[1] ?? '', 4, true) : chatId})` : chatInfo ? shortenText(chatInfo.did?.split(':')[1] ?? '', 6, true) : shortenText(chatId, 6, true)}

                </Span>

                <Options
                    options={options}
                    setOptions={setOptions}
                    isGroup={isGroup}
                    chatInfo={chatInfo}
                    groupInfo={groupInfo}
                    setGroupInfo={setGroupInfo}
                    theme={theme}
                />

                {/* {!isGroup && 
                    <VideoChatSection>
                        <Image src={VideoChatIcon} height="18px" maxHeight="18px" width={'auto'} />
                    </VideoChatSection>
                    } */}

                <ToastContainer />


            </Container>
        )
    } else {
        return null;
    }
}


const Container = styled.div`
  width: 100%;
  background: ${(props) => props.theme.backgroundColor.chatProfileBackground};
  border:${(props) => props.theme.border?.chatProfile};
  border-radius:${(props) => props.theme.borderRadius?.chatProfile};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 6px;
  box-sizing: border-box;
  position: relative;
`;

const ImageItem = styled.div`
  position: relative;
`;

const DummyImage = styled.div`
    height: 48px;
    width: 48px;
    border-radius: 100%;
    background: #ccc;
`;

const DropDownBar = styled.div`
    position: absolute;
    top: 30px;
    left: -130px;
    display: block;
    min-width: 140px;
    color: rgb(101, 119, 149);
    border: ${(props) => `1px solid ${props.theme.defaultBorder}`};
    background: ${(props) => props.theme.backgroundColor.chatReceivedBubbleBackground};
    z-index: 10;
    border-radius: 16px;
`;

const VideoChatSection = styled.div`
    margin: 0 25px 0 auto; 
`;

const DropDownItem = styled(Span)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 16px;
  z-index: 3000000;
  width: 100%;
`;

const TextItem = styled(Span)`
    white-space: nowrap;
    overflow: hidden;
`;











