import React from "react";

import '../styles/Home.css';
import Card from '../comp/Card';
import  Grid from '../comp/Grid'
import Box from  '../comp/Box'

import Theory from "../comp/Theory";
import Footer from "../comp/Footer";
import SearchBar from "../comp/SearchBar"
import Navbar from "../comp/Navbar";

export default function Home() {
  return (
    <>

    <SearchBar/>
      <Card />
      <Grid />
      <Box />
      <Theory />
      <Footer/>
    </>
  );
}
