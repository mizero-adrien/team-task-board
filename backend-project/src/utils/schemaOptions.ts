// Output rule for every model: "id" instead of "_id", and no "__v".
// The parameters are typed as unknown on purpose: Mongoose's own types for
// "ret" change between versions, and a looser parameter always fits.
export const jsonWithId = {
  versionKey: false,
  transform: (_doc: unknown, ret: unknown) => {
    const { _id, ...rest } = ret as Record<string, unknown> & { _id: unknown };
    return { id: String(_id), ...rest };
  },
};
