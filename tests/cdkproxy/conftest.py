import pytest

from dataall.db import models, api


@pytest.fixture(scope='module', autouse=True)
def permissions(db):
    with db.scoped_session() as session:
        yield api.Permission.init_permissions(session)


@pytest.fixture(scope='module', autouse=True)
def org(db) -> models.Organization:
    with db.scoped_session() as session:
        org = models.Organization(
            name='org', owner='me', label='org', description='test'
        )
        session.add(org)
    yield org


@pytest.fixture(scope='module', autouse=True)
def env(db, org: models.Organization) -> models.Environment:
    with db.scoped_session() as session:
        env = models.Environment(
            name='env',
            owner='me',
            organizationUri=org.organizationUri,
            label='env',
            AwsAccountId='1' * 12,
            region='eu-west-1',
            EnvironmentDefaultIAMRoleArn=f"arn:aws:iam::{'1'*12}:role/default_role",
            EnvironmentDefaultIAMRoleName='default_role',
            EnvironmentDefaultBucketName='envbucketbcuketenvbucketbcuketenvbucketbcuketenvbucketbcuket',
            EnvironmentDefaultAthenaWorkGroup='DefaultWorkGroup',
            CDKRoleArn='xxx',
            SamlGroupName='admins',
            subscriptionsEnabled=True,
            subscriptionsConsumersTopicName='topicname',
        )
        session.add(env)
        session.commit()
        env_group = models.EnvironmentGroup(
            environmentUri=env.environmentUri,
            groupUri=env.SamlGroupName,
            environmentIAMRoleArn=env.EnvironmentDefaultIAMRoleArn,
            environmentIAMRoleName=env.EnvironmentDefaultIAMRoleName,
            environmentAthenaWorkGroup='workgroup',
        )
        session.add(env_group)
        tags = models.KeyValueTag(
            targetType='environment',
            targetUri=env.environmentUri,
            key='CREATOR',
            value='customtagowner',
        )
        session.add(tags)
    yield env


@pytest.fixture(scope='module', autouse=True)
def redshift_cluster(db, env: models.Environment) -> models.RedshiftCluster:
    with db.scoped_session() as session:
        cluster = models.RedshiftCluster(
            environmentUri=env.environmentUri,
            organizationUri=env.organizationUri,
            owner='owner',
            label='cluster',
            description='desc',
            masterDatabaseName='dev',
            masterUsername='masteruser',
            databaseName='datahubdb',
            nodeType='dc1.large',
            numberOfNodes=2,
            port=5432,
            region=env.region,
            AwsAccountId=env.AwsAccountId,
            status='CREATING',
            vpc='vpc-12344',
            IAMRoles=[env.EnvironmentDefaultIAMRoleArn],
            tags=[],
            SamlGroupName='admins',
            imported=False,
        )
        session.add(cluster)
    yield cluster


@pytest.fixture(scope='function', autouse=True)
def patch_ssm(mocker):
    mocker.patch(
        'dataall.utils.parameter.Parameter.get_parameter', return_value='param'
    )
