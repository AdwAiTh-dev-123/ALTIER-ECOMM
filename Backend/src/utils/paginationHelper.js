export const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit, 10)) || defaultLimit,
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginatedResponse = (
  firstArg,
  totalItemsArg,
  pageArg,
  limitArg,
  extraFieldsArg = {},
) => {
  let data, totalItems, page, limit, extraFields;

  if (Array.isArray(firstArg)) {
    data = firstArg;
    totalItems = Number(totalItemsArg) || 0;
    page = Math.max(1, parseInt(pageArg, 10) || 1);
    limit = Math.max(1, parseInt(limitArg, 10) || 10);
    extraFields = extraFieldsArg || {};
  }
  else if (typeof firstArg === "object" && firstArg !== null) {
    data = firstArg.data || [];
    totalItems = Number(firstArg.totalItems) || 0;
    page = Math.max(1, parseInt(firstArg.page, 10) || 1);
    limit = Math.max(1, parseInt(firstArg.limit, 10) || 10);
    extraFields = firstArg.extraFields || {};
  } else {
    data = [];
    totalItems = 0;
    page = 1;
    limit = 10;
    extraFields = {};
  }

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    success: true,
    count: data.length,
    data,
    orders: data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      totalOrders: totalItems,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    ...extraFields,
  };
};
