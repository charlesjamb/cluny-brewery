import React, { Component } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import GlobalStyle from './GlobalStyle';
import { ResponsiveLine } from '@nivo/line';
import Card from '@material-ui/core/Card';
import Fab from '@material-ui/core/Fab';
import CachedIcon from '@material-ui/icons/Cached';
import AppBar from '@material-ui/core/AppBar';
import axios from 'axios';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorOutlined from '@material-ui/icons/ErrorOutlined';
import LastTemperatures from './LastTemperatures';

const Page = styled.div`
  background-color: whitesmoke;
`;

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  min-width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.div`
  font-size: 5vh;
  font-weight: bold;
  margin: 3vh;
`;

const GraphCard = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2em;
  width: 90vw;
  height: 75vh;

  @media (max-width: 700px) {
    display: none;
  }
`;

const ReloadButtonContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  margin: 3vh;
`;

const ErrorContainer = styled.div`
  color: firebrick;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

class App extends Component {
  state = {
    data: [],
    error: false,
    loading: true,
    temperatures: {},
    xMax: 0,
    xMin: 100,
    lastId: 0,
  };

  componentDidMount = () => this.loadData();

  handleData = data => {
    let xMin = this.state.xMin;
    let xMax = this.state.xMax;
    let lastId = this.state.lastId;
    const temperatures = [];
    const temperature_average = {
      id: 'Average',
      data: [],
    };
    const temperature_blue = {
      id: 'Blue',
      data: [],
    };
    const temperature_green = {
      id: 'Green',
      data: [],
    };
    const temperature_yellow = {
      id: 'Yellow',
      data: [],
    };
    var oneWeekAgo = moment().subtract(7, 'days');
    let prevTime = moment();
    data.forEach(d => {
      const time = moment(d.date);
      if (time.isBefore(oneWeekAgo)) return false;
      if (prevTime.isSame(time)) return false;
      prevTime = moment(time);
      if (d.temperature_average < xMin) xMin = d.temperature_average;
      if (d.temperature_average > xMax) xMax = d.temperature_average;
      if (lastId < d.id) lastId = d.id;
      temperature_average.data.push({
        x: time.format('DD/MM, HH:mm'),
        y: d.temperature_average.toFixed(2),
      });
      temperature_blue.data.push({
        x: time.format('DD/MM, HH:mm'),
        y: d.temperature_blue.toFixed(2),
      });
      temperature_green.data.push({
        x: time.format('DD/MM, HH:mm'),
        y: d.temperature_green.toFixed(2),
      });
      temperature_yellow.data.push({
        x: time.format('DD/MM, HH:mm'),
        y: d.temperature_yellow.toFixed(2),
      });
    });
    temperatures.push(temperature_blue, temperature_green, temperature_yellow, temperature_average);
    return { temperatures, xMax, xMin, lastId };
  };

  loadData = () => {
    axios
      .get(
        'https://cors-anywhere.herokuapp.com/http://3.20.162.22:6789/temperatures/v2.0',
      )
      .then(res => {
        const { temperatures, xMax, xMin, lastId } = this.handleData(res.data);
        this.setState({
          data: res.data,
          temperatures,
          xMin,
          xMax,
          lastId,
          loading: false,
          error: false,
        });
      })
      .catch(e => {
        console.error(e);
        this.setState({ error: true, loading: false });
      });
  };

  buttonClick = () => {
    this.setState({ loading: true, error: false, temperatures: [] }, () => {
      this.loadData();
    });
  };

  renderAxisBottom = data => {
    const axisBottom = [];
    const daysData = data[0].data;
    // only keep 31 ticks in the bottom axis
    daysData.forEach((val, index) => {
      if (index % Math.ceil(daysData.length / 32) === 0) axisBottom.push(val.x);
    });
    return axisBottom;
  };

  render() {
    return (
      <Page>
        <GlobalStyle />
        <Container>
          <AppBar color="primary" position="relative">
            <Title>Cluny Street Brewery</Title>
          </AppBar>
          {this.state.data.length > 0 && (
            <LastTemperatures lastId={this.state.lastId} data={this.state.data} />
          )}
          <GraphCard>
            {this.state.temperatures.length > 0 && (
              <ResponsiveLine
                curve="natural"
                minY="auto"
                colors={['royalblue', 'forestgreen', 'gold', 'tomato']}
                margin={{
                  top: 20,
                  right: 50,
                  bottom: 100,
                  left: 80,
                }}
                axisLeft={{
                  orient: 'left',
                  tickSize: 10,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'temperatures',
                  legendOffset: -50,
                  legendPosition: 'middle',
                }}
                yScale={{
                  type: 'linear',
                  stacked: false,
                  min: this.state.xMin - 2,
                  max: this.state.xMax + 2,
                }}
                axisBottom={{
                  tickRotation: -45,
                  tickValues: this.renderAxisBottom(this.state.temperatures),
                }}
                data={this.state.temperatures}
              />
            )}
            {this.state.loading && <CircularProgress size={100} />}
            {this.state.error && (
              <ErrorContainer>
                <ErrorOutlined style={{ fontSize: '3em' }} />
                <p>An error as occurred</p>
              </ErrorContainer>
            )}
          </GraphCard>
          <ReloadButtonContainer>
            <Fab color="secondary" aria-label="Reload" onClick={this.buttonClick}>
              {this.state.loading ? <CircularProgress color="white" size={25} /> : <CachedIcon />}
            </Fab>
          </ReloadButtonContainer>
        </Container>
      </Page>
    );
  }
}

export default App;
