import * as yup from 'yup';


export const trackSchema = yup.object({
  spotifyId: yup.string().required("Spotify ID is required"),
  votes: yup.number().min(0, "Votes cannot be negative").required("Votes are required"),
  name: yup.string().when('$isNew', (isNew, schema) =>
    isNew ? schema.required("Track name is required") : schema
  ),
  artists: yup.array().of(yup.string()).when('$isNew', (isNew, schema) =>
    isNew ? schema.required("Artists are required") : schema
  ),
  albumCoverUrl: yup.string().url().when('$isNew', (isNew, schema) =>
    isNew ? schema.required("Album cover URL is required") : schema
  )
});


export const roomDataSchema = yup.object({
  id: yup.string().required("Room ID is required"),
  roomName: yup.string().required("Room name is required"),
  tracks: yup.array().of(trackSchema)
});
