import * as yup from 'yup';


export const trackSchema = yup.object({
  spotifyId: yup.string().required("Spotify ID is required"),
  votes: yup.number().min(0, "Votes cannot be negative").required("Votes are required"),
  name: yup.string().when('$isNew', {
    is: true,
    then: () => yup.string().required("Track name is required"),
    otherwise: () => yup.string().notRequired()
  }),
  artists: yup.array().of(yup.string()).when('$isNew', {
    is: true,
    then: () => yup.array().of(yup.string()).required("Artists are required"),
    otherwise: () => yup.array().of(yup.string()).notRequired()
  }),
  albumCoverUrl: yup.string().url().when('$isNew', {
    is: true,
    then: () => yup.string().required("Album cover URL is required"),
    otherwise: () => yup.string().notRequired()
  })
});


export const roomDataSchema = yup.object({
  id: yup.string().required("Room ID is required"),
  roomName: yup.string().required("Room name is required"),
  tracks: yup.array().of(trackSchema)
});
