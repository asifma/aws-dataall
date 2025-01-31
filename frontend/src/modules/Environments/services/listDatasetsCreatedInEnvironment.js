import { gql } from 'apollo-boost';

export const listDatasetsCreatedInEnvironment = ({
  filter,
  environmentUri
}) => ({
  variables: {
    environmentUri,
    filter
  },
  query: gql`
    query ListDatasetsCreatedInEnvironment(
      $filter: DatasetFilter
      $environmentUri: String
    ) {
      listDatasetsCreatedInEnvironment(
        environmentUri: $environmentUri
        filter: $filter
      ) {
        count
        page
        pages
        hasNext
        hasPrevious
        nodes {
          datasetUri
          label
          AwsAccountId
          region
          GlueDatabaseName
          SamlAdminGroupName
          name
          S3BucketName
          created
          owner
          stack {
            status
          }
        }
      }
    }
  `
});
