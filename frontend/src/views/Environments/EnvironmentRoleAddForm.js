import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  Divider,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import Autocomplete from '@mui/lab/Autocomplete';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { LoadingButton } from '@mui/lab';
import { GroupAddOutlined } from '@mui/icons-material';
import { SET_ERROR } from '../../store/errorReducer';
import { useDispatch } from '../../store';
import useClient from '../../hooks/useClient';
import listCognitoGroups from '../../api/Groups/listCognitoGroups';
import addConsumptionRoleToEnvironment from '../../api/Environment/addConsumptionRoleToEnvironment'
const EnvironmentRoleAddForm = (props) => {
  const { environment, onClose, open, reloadRoles, ...other } = props;
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const client = useClient();
  const [permissions, setPermissions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupOptions, setGroupOptions] = useState([]);
  const [roleError, setRoleError] = useState(null);

  const filter = {
    type: "environment",
    uri: environment.environmentUri
  }

  const fetchGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const response = await client.query(listCognitoGroups({ filter }));
      if (!response.errors) {
        setGroupOptions(
          response.data.listCognitoGroups.map((g) => ({
            ...g,
            value: g.groupName,
            label: g.groupName
          }))
        );
      } else {
        dispatch({ type: SET_ERROR, error: response.errors[0].message });
      }
    } catch (e) {
      dispatch({ type: SET_ERROR, error: e.message });
    } finally {
      setLoadingGroups(false);
    }
  }, [client, dispatch, environment]);

  useEffect(() => {
    if (client) {
      fetchGroups().catch((e) =>
        dispatch({ type: SET_ERROR, error: e.message })
      );
    }
  }, [client, fetchGroups, dispatch]);

  async function submit(values, setStatus, setSubmitting, setErrors) {
    try {
      if (!roleArn) {
        setRoleError('* Role Arn is required');
      } else {
        const response = await client.mutate(addConsumptionRoleToEnvironment
          ({
            groupUri: values.groupUri,
            consumptionRoleName: values.consumptionRoleName,
            IAMRoleArn: values.IAMRoleArn,
          })
        );
        if (!response.errors) {
          setStatus({ success: true });
          setSubmitting(false);
          enqueueSnackbar('IAM role added to environment', {
            anchorOrigin: {
              horizontal: 'right',
              vertical: 'top'
            },
            variant: 'success'
          });
          if (reloadRoles) {
            reloadRoles();
          }
          if (onClose) {
            onClose();
          }
        } else {
          dispatch({ type: SET_ERROR, error: response.errors[0].message });
        }
      }
    } catch (err) {
      console.error(err);
      setStatus({ success: false });
      setErrors({ submit: err.message });
      setSubmitting(false);
      dispatch({ type: SET_ERROR, error: err.message });
    }
  }

  if (!environment) {
    return null;
  }

  if (loading || loadingGroups) {
    return <CircularProgress size={10} />;
  }

  return (
    <Dialog maxWidth="lg" fullWidth onClose={onClose} open={open} {...other}>
      <Box sx={{ p: 3 }}>
        <Typography
          align="center"
          color="textPrimary"
          gutterBottom
          variant="h4"
        >
          Add a consumption IAM role to environment {environment.label}
        </Typography>
        <Typography align="center" color="textSecondary" variant="subtitle2">
          An IAM consumption role is owned by the selected Team. The owners team request access on behalf of this IAM role that can be used by downstream applications.
        </Typography>
          <Box sx={{ p: 3 }}>
            <Formik
              initialValues={{
                groupUri: ''
              }}
              validationSchema={Yup.object().shape({
                groupUri: Yup.string()
                  .max(255)
                  .required('*Owners Team is required'),
                consumptionRoleName: Yup.string()
                  .max(255)
                  .required('*Consumption Role Name is required'),
                IAMRoleArn: Yup.string()
                  .required('*IAM Role Arn is required'),
              })}
              onSubmit={async (
                values,
                { setErrors, setStatus, setSubmitting }
              ) => {
                await submit(values, setStatus, setSubmitting, setErrors);
              }}
            >
              {({
                errors,
                handleChange,
                handleSubmit,
                isSubmitting,
                setFieldValue,
                touched,
                values
              }) => (
                <form onSubmit={handleSubmit}>
                  <CardContent>
                    <TextField
                      error={Boolean(
                        touched.consumptionRoleName &&
                          errors.consumptionRoleName
                      )}
                      fullWidth
                      helperText={
                        touched.consumptionRoleName &&
                        errors.consumptionRoleName
                      }
                      label="Consumption Role Name"
                      placeholder="Name to identify your IAM role in data.all"
                      name="consumptionRoleName"
                      onChange={handleChange}
                      value={values.consumptionRoleName}
                      variant="outlined"
                    />
                  </CardContent>
                  <CardContent>
                    <TextField
                      error={Boolean(
                        touched.IAMRoleArn &&
                          errors.IAMRoleArn
                      )}
                      fullWidth
                      helperText={
                        touched.IAMRoleArn &&
                        errors.IAMRoleArn
                      }
                      label="IAM Role ARN"
                      placeholder="IAM Role ARN"
                      name="IAMRoleArn"
                      onChange={handleChange}
                      value={values.IAMRoleArn}
                      variant="outlined"
                    />
                  </CardContent>
                  <CardContent>
                    <Autocomplete
                      id="groupUri"
                      freeSolo
                      options={groupOptions.map((option) => option.value)}
                      onChange={(event, value) => {
                        setFieldValue('groupUri', value);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Responsible Team"
                          margin="normal"
                          error={Boolean(touched.groupUri && errors.groupUri)}
                          helperText={touched.groupUri && errors.groupUri}
                          onChange={handleChange}
                          value={values.groupUri}
                          variant="outlined"
                        />
                      )}
                    />
                  </CardContent>
                  <Box>
                    <CardContent>
                      <LoadingButton
                        fullWidth
                        startIcon={<GroupAddOutlined fontSize="small" />}
                        color="primary"
                        disabled={isSubmitting}
                        type="submit"
                        variant="contained"
                      >
                        Add Consumption Role
                      </LoadingButton>
                    </CardContent>
                  </Box>
                </form>
              )}
            </Formik>
          </Box>
      </Box>
    </Dialog>
  );
};

EnvironmentRoleAddForm.propTypes = {
  environment: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  reloadRoles: PropTypes.func,
  open: PropTypes.bool.isRequired
};

export default EnvironmentRoleAddForm;
