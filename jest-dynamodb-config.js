module.exports = {
  tables: [
    {
      TableName: `openwishlist-preview-dev`,
      KeySchema: [
        { AttributeName: 'url', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'url', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'idIndex',
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
    }
  ]
};
