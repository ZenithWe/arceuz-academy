import {getChatGPTUser} from "./chatgpt-auth";
import {catalog,isProducer} from "@/db/catalog";
import StoreHome from "./storefront-components";
export const dynamic="force-dynamic";
export default async function Home(){const user=await getChatGPTUser();return <StoreHome courses={await catalog(user)} producer={isProducer(user)} signedIn={!!user}/>}
