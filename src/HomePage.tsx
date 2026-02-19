import { signOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import TextSearch from "./components/TextSearch";


export function HomePage( {user}:{user:User} ){

    const nav= useNavigate();
    const handleLogout = async ()=>{
        await signOut(auth);
        nav("/login", {replace: true});
    }
    return(
        <>
        <div className="home-page">
            <div className="account-info">
                <h1> Welcome to Your Personal AI Dictionary</h1>
                <p> Logged in as: {user.email} </p>
                <button onClick={ handleLogout}>Logout</button>
            </div>

            <div className="dictionary-features">
                <TextSearch/>
            </div>
        </div>
            
        </>
    );
}