export const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10)) || defaultLimit,
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginatedResponse = ({
  page,
  limit,
  totalItems,
  data,
  extraFields = {},
}) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    success: true,
    count: data.length,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    ...extraFields,
  };
};
