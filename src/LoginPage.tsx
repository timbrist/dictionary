import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { useState } from "react";
import { useNavigate ,Navigate } from "react-router-dom";
import { auth } from "./firebase";


export function LoginPage({user}:{user:User|null}){
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword]=useState("");
    const [error, setError] = useState<string |null>(null);
    const [loading, setLoading] = useState(false);

    if(user) return <Navigate to="/home" replace/>

    const handleSubmit = async (e: React.SubmitEvent)=>{
        e.preventDefault();
        
        setError(null);
        setLoading(true);

        try{
            await signInWithEmailAndPassword(auth, email, password);
            nav("/home", {replace: true});
        }catch(err){    
            setError('Login Failed'); 
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
        <div className="login-div"> 
            <h1 className="login-title">Login</h1>
            <form onSubmit={ handleSubmit }>
                <input 
                    placeholder="Email" 
                    value={email}
                    onChange={ (e)=>{ setEmail(e.target.value) }}
                    autoComplete="email"
                />
                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={ (e) => { setPassword(e.target.value)} }
                    autoComplete="current-password"
                />
                <button disabled={loading}>
                    {loading ? "Login in process...": "Log in"}
                </button>
            </form>
            {error && <p> {error} </p>}
        </div>
        </>
    );
}