// redux/features/dynamicType/dynamicTypeApiSlice.js
import { apiSlice } from "@/redux/services/apiSlice";

export const dynamicTypeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    dynamicTypes: builder.query({
      query: ({ dynamicApi, searchParams = {} }) => {
        const { searchTerm, id } = searchParams;

        // Construct query string with only search parameters
        const queryParams = new URLSearchParams();
        if (id) queryParams.set("id", id);
        if (searchTerm) queryParams.set("searchTerm", searchTerm);

        return {
          url: `/api/${dynamicApi}?${queryParams.toString()}`,
          method: "GET",
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
          },
        };
      },
      providesTags: ["DynamicType"],
    }),
  }),
});

export const { useDynamicTypesQuery } = dynamicTypeApiSlice;

// // redux\features\dynamicType\dynamicTypeApiSlice.js
// import { apiSlice } from "@/redux/services/apiSlice";

// export const dynamicTypeApiSlice = apiSlice.injectEndpoints({
//   endpoints: (builder) => ({
//     dynamicTypes: builder.query({
//       query: ({ dynamicApi, id }) => {
//         // Remove the extra curly brace that was causing the URL issue
//         const url = id ? `/api/${dynamicApi}?id=${id}` : `/api/${dynamicApi}`;
//         return {
//           url,
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json;charset=UTF-8",
//           },
//         };
//       },
//     }),
//   }),
// });

// export const { useDynamicTypesQuery } = dynamicTypeApiSlice;
