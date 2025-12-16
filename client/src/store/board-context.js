import  { createContext } from 'react'

const boardContext = createContext({
    canvasId: null,  
    activeToolItem: "",
    toolActionType: "",
    elements: [],
    history: [[]],
    index: 0,
    
    boardMouseDownHandler: () => {},
    changeToolHandler: () => {},
    boardMouseMoveHandler: () => {},
    boardMouseUpHandler: () => {},
    textAreaBlurHandler: () => {},
    saveCanvas: () => {},
}) 

export default boardContext