import ApiClient from "./api/axios/apiClient";
import ProfileService, { ProfileApiClient } from "./api/entities/project";

const profileApiClient = new ProfileApiClient(new ApiClient());
export const profileService = new ProfileService(profileApiClient);
