import mitt from "mitt";
// If you don't need to know any data about the event, keep the payload as undefined
export type AppEvents = {
  medicalDataUploaded: undefined;
};

const emitter = mitt<AppEvents>();
export default emitter;
