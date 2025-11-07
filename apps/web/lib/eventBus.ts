import mitt from "mitt";
// If you don't need to know any data about the event u use,just keep the payload as undefined
export type AppEvents = {
  medicalDataUploaded: undefined;
  medicalDataDeleting: undefined;
  medicalDataDeleted: undefined;
  userUpdated: undefined;
};

const emitter = mitt<AppEvents>();
export default emitter;
