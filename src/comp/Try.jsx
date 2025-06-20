import React, { useState } from "react";

function Try() {
const [email, setEmail] = useState("");

const [password, setPassword] = useState("");

const isDisabled = !email || !password;

const handleclick = (e) => {
    e.preventDefault();
    console.log('-----form data-----')
    console.log(`Email:${email}`);
    console.log(`Password:${password}`);

    setEmail('');
    setPassword('');
};

return (
<>
    <h1> just try one </h1>
    <form>
    <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
    />
    <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
    />

    <button disabled={isDisabled} onClick={handleclick} type="Submit">
        Submit
    </button>
    </form>
</>
);
}

export default Try;
