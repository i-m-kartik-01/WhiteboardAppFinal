import React, { useContext } from 'react'
import classes from "./index.module.css"
import cx from "classnames"
import { MdOutlineFormatColorText } from "react-icons/md"
import { LuRectangleHorizontal } from 'react-icons/lu'
import { FaSlash, FaPaintBrush, FaRegCircle, FaArrowRight, FaDownload, FaUndo, FaRedo, FaBrush, FaEraser, FaSave } from 'react-icons/fa'
import boardContext from '../../store/board-context'
import { TOOL_ITEMS } from '../../constants'

const Toolbar = () => {
  const{activeToolItem, changeToolHandler, undo, redo, saveCanvas} = useContext(boardContext);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");
    const data = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "board.png";
    anchor.click()
  }
  return (
    <div className={classes.container}>

      <div className={
        cx(classes.toolItem,
          {[classes.active]: activeToolItem === TOOL_ITEMS.BRUSH}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.BRUSH)}
        ><FaPaintBrush/></div> 

      <div className={
        cx(classes.toolItem,{[classes.active]: activeToolItem === TOOL_ITEMS.LINE}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.LINE)}
        >< FaSlash/></div>

        <div className={
        cx(classes.toolItem,
          {[classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.RECTANGLE)}
        ><LuRectangleHorizontal/></div>

        <div className={
        cx(classes.toolItem,
          {[classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.CIRCLE)}
        ><FaRegCircle/></div> 

        <div className={
        cx(classes.toolItem,
          {[classes.active]: activeToolItem === TOOL_ITEMS.ARROW}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.ARROW)}
        ><FaArrowRight/></div> 


        <div className={
        cx(classes.toolItem,
          {[classes.active]: activeToolItem === TOOL_ITEMS.TEXT}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.TEXT)}
        ><MdOutlineFormatColorText/></div> 
        
        <div className={
        cx(classes.toolItem,
          {[classes.active]: activeToolItem === TOOL_ITEMS.ERASER}) }
         onClick={() => changeToolHandler(TOOL_ITEMS.ERASER)}
        ><FaEraser/></div> 

        <div className={classes.toolItem}
         onClick={undo}
        ><FaUndo/></div> 

        <div className={classes.toolItem}
         onClick={redo}
        ><FaRedo/></div> 
        <div className={classes.toolItem}
         onClick={handleDownloadClick}
        ><FaDownload/></div> 
        <div className={classes.toolItem} onClick={saveCanvas}>
          <FaSave />
        </div>

      </div>
      
  )
}
export default Toolbar